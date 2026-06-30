create policy "attendance_events_insert_own_response"
on attendance_events for insert
to authenticated
with check (
  changed_by = auth.uid()
  and exists (
    select 1
    from match_attendances
    where match_attendances.id = attendance_events.attendance_id
      and match_attendances.profile_id = auth.uid()
  )
);
