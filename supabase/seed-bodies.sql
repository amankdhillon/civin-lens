-- Sample governing bodies for the prototype. Agenda items are SAMPLE data.
-- Replace the about text and add real district labels and source links before any real testing.
insert into bodies (id, name, level, district_label, about) values
  ('bos', 'Board of Supervisors (sample)', 'county', 'District 1 (sample)',
   'Elected supervisors set the county budget, run county services, and decide land-use rules in unincorporated areas.'),
  ('sd-council', 'City Council (sample)', 'city', 'District 3 (sample)',
   'Elected council members set the city budget, pass ordinances, and approve city contracts.'),
  ('cv-council', 'City Council, second city (sample)', 'city', 'District 2 (sample)',
   'Elected council members set city policy and budget, pass ordinances, and approve city contracts.'),
  ('esc-council', 'City Council, third city (sample)', 'city', 'District 1 (sample)',
   'Elected council members set city policy and budget, pass ordinances, and approve city contracts.'),
  ('sdusd', 'Unified School District Board (sample)', 'school', 'Area 2 (sample)',
   'Elected trustees set district policy, approve the budget, and oversee the superintendent.'),
  ('suhsd', 'High School District Board (sample)', 'school', 'Area 1 (sample)',
   'Elected trustees set policy and budget for the district''s high schools.'),
  ('euhsd', 'High School District Board, second district (sample)', 'school', 'Area 3 (sample)',
   'Elected trustees set policy and budget for the district''s high schools.')
on conflict (id) do nothing;
