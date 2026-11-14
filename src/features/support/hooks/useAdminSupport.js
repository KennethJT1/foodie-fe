import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';

import { TICKET_POLL_MS, useTicketLive } from './useTicketLive';
import { supportApi } from '../api/support.api';

export const useAdminTickets = (params) =>
  useQuery({
    queryKey: queryKeys.tickets.list({ scope: 'admin', ...params }),
    queryFn: () => supportApi.adminTickets(params),
    placeholderData: keepPreviousData,
  });

/** A ticket in the inbox; new customer / vendor / rider replies show up without a refresh. */
export const useAdminTicket = (id) => {
  const queryKey = queryKeys.tickets.detail(id);
  useTicketLive(queryKey, Boolean(id));
  return useQuery({
    queryKey,
    queryFn: () => supportApi.adminTicket(id),
    enabled: Boolean(id),
    refetchInterval: TICKET_POLL_MS,
  });
};

export const useSupportAgents = () =>
  useQuery({ queryKey: ['admin', 'agents'], queryFn: supportApi.agents, staleTime: 5 * 60 * 1000 });

const useTicketMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (ticket) => {
      qc.setQueryData(queryKeys.tickets.detail(ticket.id), ticket);
      qc.invalidateQueries({ queryKey: [...queryKeys.tickets.all, 'list'] });
    },
    onError: (e) => toast.error(e),
  });
};

export const useUpdateTicket = () => useTicketMutation(supportApi.updateTicket);
export const useReplyToTicket = () => useTicketMutation(supportApi.replyAsAdmin);
