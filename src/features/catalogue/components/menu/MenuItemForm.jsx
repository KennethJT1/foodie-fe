import { SearchX, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/data';
import {
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonText,
  toast,
} from '@/components/feedback';
import {
  Form,
  FormInput,
  FormSelect,
  FormSubmit,
  FormTextarea,
  ImageUpload,
  MoneyInput,
  useZodForm,
} from '@/components/forms';
import { Button, Card, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

import { AvailabilityFields } from './AvailabilityFields';
import { OptionGroupsEditor } from './OptionGroupsEditor';
import { useCategories } from '../../hooks/useCatalogue';
import {
  useDeleteMenuItem,
  useSaveMenuItem,
  useVendorMenu,
  useVendorMenuItem,
} from '../../hooks/useVendorMenu';
import { menuItemSchema, toMenuBody, toMenuForm } from '../../schemas/menu-item.schema';

const PREP_TIMES = [5, 10, 15, 20, 25, 30, 40, 50, 60, 90].map((m) => ({
  value: String(m),
  label: `${m} min`,
}));

function ItemForm({ item, limits }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const save = useSaveMenuItem();
  const remove = useDeleteMenuItem();
  const [isDeleting, setDeleting] = useState(false);
  const form = useZodForm(menuItemSchema(limits.photosPerItem), {
    defaultValues: toMenuForm(item),
  });

  const submit = async (values) => {
    await save.mutateAsync({ ...toMenuBody(values), id: item?.id });
    toast.success(item ? `${values.name} saved` : `${values.name} added to your menu`);
    navigate(ROUTES.vendor.menu);
  };

  return (
    <>
      <PageHeader
        title={item ? `Edit ${item.name}` : 'Add new item'}
        backTo={ROUTES.vendor.menu}
        backLabel="Menu"
        actions={
          item && (
            <Button
              variant="ghost"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleting(true)}
            >
              Delete item
            </Button>
          )
        }
      />
      <Form form={form} onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            <Card header={<CardTitle title="Details" />}>
              <div className="space-y-4">
                <FormInput name="name" label="Food name" placeholder="Party jollof rice" />
                <FormTextarea
                  name="description"
                  label="Description (optional)"
                  rows={3}
                  maxLength={500}
                  hint="What's in it, how spicy, portion size. Up to 500 characters."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormSelect
                    name="categoryId"
                    label="Category"
                    placeholder="Pick a category"
                    options={(categories.data?.data ?? []).map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                  <MoneyInput name="price" label="Price" placeholder="3500" />
                  <FormInput name="portion" label="Portion (optional)" placeholder="1 plate" />
                  <FormSelect name="prepTimeMins" label="Preparation time" options={PREP_TIMES} />
                </div>
              </div>
            </Card>
            <Card header={<CardTitle title="Choices" />}>
              <OptionGroupsEditor />
            </Card>
          </div>
          <div className="space-y-4">
            <Card
              header={
                <CardTitle
                  title="Photos"
                  description={`Up to ${limits.photosPerItem} on your ${limits.planName} plan. 4:3, under 2 MB.`}
                />
              }
            >
              <ImageUpload
                name="photos"
                max={limits.photosPerItem}
                itemLabel="photo"
                label="Food photos"
              />
            </Card>
            <Card>
              <AvailabilityFields />
            </Card>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="outline">
            <Link to={ROUTES.vendor.menu}>Cancel</Link>
          </Button>
          <FormSubmit>{item ? 'Save changes' : 'Add item'}</FormSubmit>
        </div>
      </Form>
      {item && (
        <ConfirmDialog
          open={isDeleting}
          onClose={() => setDeleting(false)}
          title={`Delete ${item.name}?`}
          message="Customers won't see it any more. Past orders keep their details."
          confirmLabel="Delete item"
          tone="danger"
          isLoading={remove.isPending}
          onConfirm={() =>
            remove.mutate(item.id, {
              onSuccess: () => {
                toast.success(`${item.name} deleted`);
                navigate(ROUTES.vendor.menu);
              },
              onError: (e) => toast.error(e),
            })
          }
        />
      )}
    </>
  );
}

const Loading = () => (
  <div role="status" aria-label="Loading item" className="space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <SkeletonText lines={8} />
  </div>
);

/** Create (no `id`) or edit a menu item, within the plan's photo and item limits. */
export function MenuItemForm({ id }) {
  const existing = useVendorMenuItem(id);
  // The list endpoint carries the plan limits for new items
  const menu = useVendorMenu(id ? undefined : { limit: 1 });
  const query = id ? existing : menu;

  if (query.isLoading) return <Loading />;
  if (query.isError) {
    if (query.error?.status === 404)
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that item"
          action={
            <Button asChild>
              <Link to={ROUTES.vendor.menu}>Back to menu</Link>
            </Button>
          }
        />
      );
    return (
      <ErrorState title="We couldn't load this item" error={query.error} onRetry={query.refetch} />
    );
  }
  const limits = id ? existing.data.limits : menu.data.meta.limits;
  if (!id && limits.menuItems != null && limits.used >= limits.menuItems)
    return (
      <EmptyState
        title="Your menu is full"
        message={`Your ${limits.planName} plan allows ${limits.menuItems} items. Upgrade to add more, or delete an item you no longer sell.`}
        action={
          <Button asChild>
            <Link to={ROUTES.vendor.plans}>See plans</Link>
          </Button>
        }
      />
    );
  return <ItemForm key={id ?? 'new'} item={id ? existing.data : null} limits={limits} />;
}
