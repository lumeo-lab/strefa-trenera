CREATE OR REPLACE FUNCTION next_coach_invoice_number(p_coach_id uuid, p_invoice_date date DEFAULT CURRENT_DATE)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invoice_year text := to_char(p_invoice_date, 'YYYY');
  next_seq integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_coach_id::text || ':' || invoice_year));

  SELECT COALESCE(
    MAX(((regexp_match(number, '^FV/' || invoice_year || '/([0-9]+)$'))[1])::integer),
    0
  ) + 1
  INTO next_seq
  FROM invoices
  WHERE coach_id = p_coach_id
    AND number LIKE 'FV/' || invoice_year || '/%';

  RETURN 'FV/' || invoice_year || '/' || lpad(next_seq::text, 3, '0');
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS invoices_coach_number_uidx
  ON invoices(coach_id, number);
