-- Fix RLS policies to allow hard deletion of softly deleted folders and tasks
drop policy "Owners can delete folders" on public.folders;
create policy "Owners can delete folders"
on public.folders for delete
to authenticated
using (owner_id = (select auth.uid()));

drop policy "Task owners or folder owners can delete tasks" on public.tasks;
create policy "Task owners or folder owners can delete tasks"
on public.tasks for delete
to authenticated
using (
  owner_id = (select auth.uid())
  or (folder_id is not null and exists (
    select 1 from public.folders f where f.id = folder_id and f.owner_id = (select auth.uid())
  ))
);
