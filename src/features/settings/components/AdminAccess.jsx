import { useState } from 'react';

import { Tabs } from '@/components/ui';

import { AdminUsersManager } from './AdminUsersManager';
import { RolesEditor } from './RolesEditor';

/** Admin accounts and what each sub-role may do. */
export function AdminAccess() {
  const [tab, setTab] = useState('users');
  return (
    <div className="space-y-4">
      <Tabs
        variant="pills"
        aria-label="Admin access"
        value={tab}
        onChange={setTab}
        items={[
          { value: 'users', label: 'Admins' },
          { value: 'roles', label: 'Roles and permissions' },
        ]}
      />
      {tab === 'users' ? <AdminUsersManager /> : <RolesEditor />}
    </div>
  );
}
