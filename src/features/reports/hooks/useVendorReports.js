import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { reportsApi } from '../api/reports.api';

export const useVendorStats = (params = { days: 14 }) =>
  useQuery({
    queryKey: queryKeys.vendorMe.stats(params),
    queryFn: () => reportsApi.vendorStats(params),
    refetchInterval: 60000,
  });

export const useVendorSales = (params) =>
  useQuery({
    queryKey: queryKeys.vendorMe.sales(params),
    queryFn: () => reportsApi.vendorSales(params),
    placeholderData: keepPreviousData,
  });

export const useVendorSalesDaily = (params = { days: 30 }) =>
  useQuery({
    queryKey: queryKeys.vendorMe.sales({ daily: true, ...params }),
    queryFn: () => reportsApi.vendorSalesDaily(params),
  });

export const useVendorEngagement = () =>
  useQuery({ queryKey: queryKeys.vendorMe.engagement, queryFn: reportsApi.vendorEngagement });
