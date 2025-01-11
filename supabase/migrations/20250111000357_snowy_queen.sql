-- Create calendar_events table
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('booking', 'maintenance', 'blocked')),
  status text NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_calendar_events_property_id ON calendar_events(property_id);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_unit_number ON calendar_events(unit_number);

-- Create updated_at trigger
CREATE TRIGGER set_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Enable read access for calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Enable insert for calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Enable update for calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Enable delete for calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Add unit_number column to properties if it doesn't exist
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS unit_number text;

-- Create unique constraint on property_id and unit_number
ALTER TABLE properties
ADD CONSTRAINT unique_property_unit_number UNIQUE (id, unit_number);