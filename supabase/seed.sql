insert into public.sop_folders (id, name, description) overriding system value values
  (1, 'Finance Controls', 'Month-end payment and invoice procedures'),
  (2, 'People Operations', 'Onboarding and access management procedures')
on conflict (id) do nothing;

insert into public.projects (id, project_code, project_name, description, owner, department, start_date, due_date, status, priority) overriding system value values
  (1, 'PRJ-001', 'Finance Month-End Close', 'Standardize invoice, payment, and evidence collection workflow.', 'Mina', 'Finance', '2026-06-01', '2026-06-30', 'In Progress', 'High'),
  (2, 'PRJ-002', 'AI Workflow Discovery', 'Map manual operations and identify practical AI automation use cases.', 'Admin', 'Operations', '2026-06-05', '2026-07-15', 'In Progress', 'Urgent')
on conflict (id) do nothing;

insert into public.sops (
  id, sop_code, sop_name, document_type, category, department, purpose, scope, steps, content, tags, owner,
  process_owner, control_owner, business_criticality, expiry_date, process_group, process_name, related_controls,
  related_systems, control_objective, control_frequency, evidence_required, risk_mitigated, compliance_requirement,
  required_approvals, reviewer, approver, approval_status, risk_level, access_level, distribution_list,
  training_required, training_audience, controlled_copy_location, version, effective_date, status, attachment_url, folder_id
) overriding system value values
  (
    1, 'SOP-001', 'Invoice Approval', 'Procedure', 'Finance Control', 'Finance',
    'Make invoice approval consistent and auditable.', 'Vendor invoices before payment release.',
    '1. Confirm invoice details. 2. Match PO or approval evidence. 3. Record reviewer decision. 4. Archive payment proof.',
    'Check vendor invoices, confirm approval evidence, record payment decision, and attach final proof.',
    '["finance","approval","audit"]'::jsonb, 'Mina', 'Mina', 'Nok', 'High', '2026-12-31',
    'Record to Report', 'Vendor invoice approval', '["FIN-AP-01","FIN-EVD-02"]'::jsonb,
    '["Accounting Drive","Bank Portal"]'::jsonb, 'Prevent unauthorized or duplicate vendor payments.',
    'Monthly', '["Approved invoice","Payment evidence"]'::jsonb, 'Duplicate payment and missing approval risk.',
    'Internal finance control', '["Finance Manager"]'::jsonb, 'Nok', 'Mina', 'Approved',
    'High', 'Internal', '["Finance","Operations"]'::jsonb, true, '["Finance team","Operations manager"]'::jsonb,
    'Finance Controls / SOP-001', '1.2', '2026-06-01', 'Published', '', 1
  ),
  (
    2, 'SOP-002', 'New Employee Setup', 'Checklist', 'People Operations', 'HR',
    'Help new staff get ready before day one.', 'New hire access, equipment, and orientation.',
    '1. Request laptop and email. 2. Schedule orientation. 3. Record probation plan.',
    'Prepare account access, device request, orientation schedule, and onboarding checklist.',
    '["hr","onboarding","access"]'::jsonb, 'Admin', 'Admin', 'Tan', 'Medium', '2026-11-30',
    'Hire to Retire', 'Employee onboarding', '["HR-ONB-01"]'::jsonb,
    '["Google Workspace","HR Folder"]'::jsonb, 'Reduce onboarding delay and missed access requests.',
    'Event-based', '["Access request","Orientation record"]'::jsonb, 'Delayed setup and missing onboarding records.',
    'Internal onboarding standard', '["HR Owner"]'::jsonb, 'Tan', 'Admin', 'Pending Review',
    'Medium', 'Internal', '["HR","IT"]'::jsonb, true, '["Hiring managers"]'::jsonb,
    'People Operations / SOP-002', '1.0', '2026-05-15', 'Draft', '', 2
  )
on conflict (id) do nothing;

insert into public.tasks (
  id, task_code, task_title, project_id, work_detail, sop_id, assigned_to, priority, start_date, due_date,
  status, progress_percent, attachment_url, created_by
) overriding system value values
  (1, 'TASK-001', 'Check June vendor invoices', 1, 'Review pending invoices and confirm approval evidence.', 1, 'Nok', 'High', '2026-06-10', '2026-06-20', 'In Progress', 60, '', 'Admin'),
  (2, 'TASK-002', 'Collect missing bank forms', 1, 'Ask two vendors for updated bank confirmation forms.', 1, 'Mina', 'High', '2026-06-11', '2026-06-18', 'Waiting', 25, '', 'Admin'),
  (3, 'TASK-003', 'Interview operations team', 2, 'Capture current workflow, pain points, and AI automation ideas.', null, 'Admin', 'Urgent', '2026-06-12', '2026-06-25', 'In Progress', 40, '', 'Admin')
on conflict (id) do nothing;

insert into public.transformations (
  id, discovery_code, client_name, department, current_workflow, pain_points, repetitive_tasks, documents_used,
  stakeholders, ai_use_cases, proposed_solution, implementation_plan, training_needed, status, owner
) overriding system value values
  (
    1, 'DISC-001', 'Portfolio Client Demo', 'Operations',
    'Manual SOP tracking happens across chat, spreadsheets, and separate folders.',
    '["No single owner view","Slow follow-up","Hard to prove evidence"]'::jsonb,
    '["Status chasing","Document search","Progress reporting"]'::jsonb,
    '["SOP files","Task sheets","Workshop notes"]'::jsonb,
    '["Operations manager","Finance owner","Team lead"]'::jsonb,
    '["SOP search assistant","Automated progress summary","Evidence checklist"]'::jsonb,
    'Centralize SOP, task, evidence, and transformation notes in one lightweight operating workspace.',
    'Pilot with one department, migrate active SOPs, train owners, then review workflow metrics weekly.',
    'Short workshop on SOP creation, task update habits, and AI-assisted workflow mapping.',
    'Discovery',
    'Admin'
  )
on conflict (id) do nothing;

insert into public.sop_evidence (sop_id, evidence_name, evidence_type, evidence_url, control_reference, uploaded_by) values
  (1, 'June invoice approval sample', 'document', 'https://example.com/invoice-approval', 'FIN-AP-01', 'Mina')
on conflict do nothing;

insert into public.sop_exceptions (sop_id, exception_code, reason, impact, workaround, owner, due_date, approval_required, status) values
  (1, 'EXC-001', 'Vendor confirmation delayed', 'Payment approval waits for updated bank evidence.', 'Escalate to finance owner and attach email trail.', 'Nok', '2026-06-24', true, 'Open')
on conflict (exception_code) do nothing;

insert into public.sop_approvals (sop_id, reviewer, approver, decision, comment) values
  (1, 'Nok', 'Mina', 'Approved', 'Ready for month-end close demo')
on conflict do nothing;

insert into public.sop_training_acknowledgements (sop_id, user_name, role, note) values
  (1, 'Nok', 'Finance Associate', 'Read and acknowledged for portfolio demo')
on conflict do nothing;

insert into public.task_comments (task_id, user_name, comment) values
  (1, 'Mina', 'Please attach the approval screenshot before payment release.')
on conflict do nothing;

insert into public.activity_logs (task_id, user_name, action, details) values
  (1, 'Admin', 'Created task', 'Initial portfolio seed task')
on conflict do nothing;
