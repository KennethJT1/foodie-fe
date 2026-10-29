import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { catalogueApi } from '../api/catalogue.api';

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories.list({ limit: 50 }),
    queryFn: () => catalogueApi.categories({ limit: 50 }),
    staleTime: 10 * 60 * 1000,
  });

export const useFoodItems = (params, options = {}) =>
  useQuery({
    queryKey: queryKeys.foodItems.list(params),
    queryFn: () => catalogueApi.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useFoodItem = (id) =>
  useQuery({
    queryKey: queryKeys.foodItems.detail(id),
    queryFn: () => catalogueApi.get(id),
    enabled: Boolean(id),
  });
