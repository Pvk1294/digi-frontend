// src/pages/AdminSecurityPage.tsx

import { Enable2FA } from '@/components/admin/Enable2FA';
import { ChangePassword } from '@/components/admin/ChangePassword';

const AdminSecurityPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="text-2xl font-bold mb-6">Security Settings</h1>
      <ChangePassword />
      <Enable2FA />
    </div>
  );
};

export default AdminSecurityPage;