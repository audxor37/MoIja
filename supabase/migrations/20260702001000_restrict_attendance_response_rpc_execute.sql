revoke all on function public.respond_to_meeting_attendance(uuid, attendance_status) from anon;
revoke all on function public.respond_to_meeting_attendance(uuid, attendance_status) from service_role;
grant execute on function public.respond_to_meeting_attendance(uuid, attendance_status) to authenticated;
