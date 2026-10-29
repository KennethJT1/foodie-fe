import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { toast } from '@/components/feedback';
import { ROUTES } from '@/constants/routes';
import { NewCartDialog, useAddToCart } from '@/features/cart';
import { FoodImage } from '@/features/catalogue';
import { formatNaira } from '@/lib/format';

/**
 * Menu card from the UI kit: text on the left, photo on the right with a round "+" button.
 * "+" adds straight to the cart when the dish has no required choices; otherwise it opens
 * the dish so the customer can pick.
 */
export function MenuItemCard({ item, vendor }) {
  const { add, dialog } = useAddToCart();
  const needsChoice = item.optionGroups?.some((g) => g.required);
  const canAdd = item.isAvailable && vendor?.isOpen !== false;

  const quickAdd = () =>
    add(
      vendor,
      [
        {
          foodItemId: item.id,
          name: item.name,
          photo: item.photos?.[0] ?? null,
          unitPrice: item.price,
          options: [],
          quantity: 1,
        },
      ],
      {
        onAdded: () => toast.success(`${item.name} added to your cart`),
      },
    );

  return (
    <article className="flex h-full gap-3 rounded-card bg-surface p-3 shadow-card transition-shadow hover:shadow-pop sm:p-4">
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="font-semibold leading-snug">
          <Link to={ROUTES.food(item.id)} className="hover:underline">
            {item.name}
          </Link>
        </h4>
        {item.description && (
          <p className="mt-1 line-clamp-3 text-xs text-ink-muted sm:text-sm">{item.description}</p>
        )}
        <p className="mt-auto pt-2 font-bold">{formatNaira(item.price)}</p>
        {!item.isAvailable && <p className="text-xs font-medium text-danger">Sold out today</p>}
      </div>
      <div className="relative w-28 shrink-0 self-start overflow-hidden rounded-xl sm:w-36">
        <FoodImage
          src={item.photos?.[0]}
          alt={`${item.name} from ${vendor?.name}`}
          className="aspect-square"
        />
        <span className="absolute bottom-0 right-0 rounded-tl-[28px] bg-surface/90 pl-2 pt-2">
          {needsChoice || !canAdd ? (
            <Link
              to={ROUTES.food(item.id)}
              aria-label={canAdd ? `Choose options for ${item.name}` : `View ${item.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={quickAdd}
              aria-label={`Add ${item.name} to cart`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      <NewCartDialog {...dialog} />
    </article>
  );
}
