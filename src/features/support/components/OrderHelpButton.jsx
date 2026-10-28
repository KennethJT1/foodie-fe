import { LifeBuoy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui';

import { NewTicketDialog } from './NewTicketDialog';

/** "Get help" on an order: opens a ticket about it, then shows the conversation. */
export function OrderHelpButton({ order, supportPath }) {
  const [isOpen, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<LifeBuoy className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        Get help
      </Button>
      <NewTicketDialog
        open={isOpen}
        order={order}
        onClose={() => setOpen(false)}
        onCreated={(t) => {
          setOpen(false);
          navigate(`${supportPath}?ticket=${t.id}`);
        }}
      />
    </>
  );
}
