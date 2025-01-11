-- Drop and recreate calendar_events table with proper constraints
DROP TABLE IF EXISTS calendar_events CASCADE;

CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('booking', 'maintenance', 'blocked')),
  status text NOT NULL CHECK (status IN ('confirmed', 'pending', 'cancelled')),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes
CREATE INDEX idx_calendar_events_property_id ON calendar_events(property_id);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE profiles.id = auth.uid()
             AND profiles.is_admin = true
           ))
    )
  );

CREATE POLICY "Enable insert for calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE profiles.id = auth.uid()
             AND profiles.is_admin = true
           ))
    )
  );

CREATE POLICY "Enable update for calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE profiles.id = auth.uid()
             AND profiles.is_admin = true
           ))
    )
  );

CREATE POLICY "Enable delete for calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = calendar_events.property_id
      AND (properties.assigned_to = auth.uid() OR
           EXISTS (
             SELECT 1 FROM profiles
             WHERE profiles.id = auth.uid()
             AND profiles.is_admin = true
           ))
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER set_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();