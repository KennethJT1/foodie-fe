import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { TICKET_POLL_MS, useTicketLive } from './useTicketLive';
import { supportApi } from '../api/support.api';

export const useMyTickets = (params) =>
  useQuery({
    queryKey: queryKeys.tickets.list({ scope: 'me', ...params }),
    queryFn: () => supportApi.myTickets(params),
    placeholderData: keepPreviousData,
  });

/** One of the user's tickets; new agent replies show up without a page refresh. */
export const useMyTicket = (id) => {
  const queryKey = [...queryKeys.tickets.detail(id), 'me'];
  useTicketLive(queryKey, Boolean(id));
  return useQuery({
    queryKey,
    queryFn: () => supportApi.myTicket(id),
    enabled: Boolean(id),
    refetchInterval: TICKET_POLL_MS,
  });
};

const useMyTicketMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (ticket) => {
      qc.setQueryData([...queryKeys.tickets.detail(ticket.id), 'me'], ticket);
      qc.invalidateQueries({ queryKey: [...queryKeys.tickets.all, 'list'] });
    },
  });
};

export const useOpenTicket = () => useMyTicketMutation(supportApi.openTicket);
export const useReplyToMyTicket = () => useMyTicketMutation(supportApi.replyToTicket);
export const useResolveMyTicket = () => useMyTicketMutation(supportApi.resolveTicket);
