import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { supportApi } from '../api/support.api';

export const useMyTickets = (params) =>
  useQuery({
    queryKey: queryKeys.tickets.list({ scope: 'me', ...params }),
    queryFn: () => supportApi.myTickets(params),
    placeholderData: keepPreviousData,
  });

export const useMyTicket = (id) =>
  useQuery({
    queryKey: [...queryKeys.tickets.detail(id), 'me'],
    queryFn: () => supportApi.myTicket(id),
    enabled: Boolean(id),
    refetchInterval: 30000,
  });

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
