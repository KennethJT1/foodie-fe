import { Bell, Edit, Heart, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardTitle,
  Checkbox,
  Combobox,
  Drawer,
  Dropdown,
  IconButton,
  Input,
  Modal,
  PriceTag,
  RadioGroup,
  Rating,
  Select,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
} from '@/components/ui';

/** Living style guide (development only). Every primitive in every variant. */

const BANK_OPTIONS = [
  { value: '058', label: 'Guaranty Trust Bank' },
  { value: '057', label: 'Zenith Bank' },
  { value: '044', label: 'Access Bank' },
  { value: '50211', label: 'Kuda Bank' },
];

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Card className="space-y-4">{children}</Card>
    </section>
  );
}

const Row = ({ children }) => <div className="flex flex-wrap items-center gap-3">{children}</div>;

export function DevUiSections() {
  const [tab, setTab] = useState('new');
  const [pill, setPill] = useState('nearby');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [paused, setPaused] = useState(false);
  const [bank, setBank] = useState('');
  const [type, setType] = useState('restaurant');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <>
      <Section title="Buttons">
        <Row>
          {['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'].map((v) => (
            <Button key={v} variant={v}>
              {v[0].toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </Row>
        <Row>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add new item</Button>
          <Button loading>Place order – ₦8,500</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row>
          <IconButton icon={Heart} label="Like" />
          <IconButton icon={Bell} label="Notifications" variant="outline" />
          <IconButton icon={Plus} label="Add" variant="primary" />
          <IconButton icon={Trash2} label="Delete" variant="danger" />
        </Row>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Food name" placeholder="Party jollof rice" hint="As customers call it" />
          <Input label="Email" error="Enter a valid email address" defaultValue="ada@" />
          <Input
            label="Search"
            labelHidden
            placeholder="Search jollof, suya…"
            leftIcon={<Search />}
          />
          <Select
            label="Category"
            placeholder="Pick a category"
            options={[
              { value: 'rice', label: 'Rice dishes' },
              { value: 'grills', label: 'Grills and suya' },
            ]}
          />
          <Combobox
            label="Bank"
            options={BANK_OPTIONS}
            value={bank}
            onChange={setBank}
            placeholder="Search banks"
          />
          <Input label="Disabled" disabled value="Can't edit" readOnly />
        </div>
        <Textarea
          label="Comment"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Checkbox
              label="Available today"
              description="Customers can order it now"
              defaultChecked
            />
            <Checkbox label="I agree to the vendor terms" />
            <Switch
              label="Pause orders"
              description="Stop new orders for a while"
              checked={paused}
              onChange={setPaused}
            />
            <Switch label="Online" size="lg" checked={isOnline} onChange={setIsOnline} />
          </div>
          <RadioGroup
            label="Vendor type"
            variant="cards"
            value={type}
            onChange={setType}
            options={[
              {
                value: 'restaurant',
                label: 'Registered restaurant',
                description: 'CAC certificate needed',
              },
              { value: 'home_cook', label: 'Home cook', description: 'No CAC needed' },
            ]}
          />
        </div>
      </Section>

      <Section title="Badges, avatars, ratings and prices">
        <Row>
          {['neutral', 'success', 'warning', 'danger', 'info', 'brand'].map((t) => (
            <Badge key={t} tone={t} dot>
              {t}
            </Badge>
          ))}
        </Row>
        <Row>
          <Avatar name="Ada Okafor" size="xs" />
          <Avatar name="Ada Okafor" size="sm" />
          <Avatar name="Bisi Adeyemi" size="md" />
          <Avatar name="Mama Put Kitchen" size="lg" shape="square" />
          <Avatar src="/logo-mark.svg" name="KJT Foodie" size="xl" />
        </Row>
        <Row>
          <Rating value={4.6} readOnly count={312} />
          <Rating value={stars} onChange={setStars} label="Rate the vendor" />
          <span className="text-sm text-ink-muted">You picked {stars || 'nothing'}</span>
        </Row>
        <Row>
          <PriceTag amount={850000} />
          <PriceTag amount={125050} size="lg" />
          <PriceTag amount={250000} compareAt={300000} size="sm" />
        </Row>
      </Section>

      <Section title="Cards, tabs, menus and tooltips">
        <Card
          header={
            <CardTitle
              title="Today's orders"
              description="Updated just now"
              action={
                <Button size="sm" variant="outline">
                  See all
                </Button>
              }
            />
          }
          footer={<span className="text-sm text-ink-muted">Footer</span>}
        >
          <p className="text-sm">Card body</p>
        </Card>
        <Tabs
          aria-label="Order queue"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'new', label: 'New', count: 2 },
            { value: 'preparing', label: 'Preparing', count: 1 },
            { value: 'ready', label: 'Ready' },
          ]}
        />
        <Tabs
          variant="pills"
          aria-label="Feed"
          value={pill}
          onChange={setPill}
          items={[
            { value: 'nearby', label: 'Near you' },
            { value: 'popular', label: 'Popular' },
            { value: 'newest', label: 'Newest' },
          ]}
        />
        <Row>
          <Dropdown
            trigger={(p) => (
              <Button variant="outline" {...p}>
                Row actions
              </Button>
            )}
            items={[
              { label: 'Edit item', icon: Edit, onSelect: () => {} },
              'separator',
              { label: 'Delete item', icon: Trash2, danger: true, onSelect: () => {} },
            ]}
          />
          <Tooltip content="Copied to clipboard">
            <Button variant="ghost">Hover or focus me</Button>
          </Tooltip>
        </Row>
      </Section>

      <Section title="Modal and drawer">
        <Row>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
        </Row>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Reject order"
          description="The customer will be refunded in full."
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Keep order
              </Button>
              <Button variant="danger" onClick={() => setModalOpen(false)}>
                Reject order
              </Button>
            </>
          }
        >
          <Select label="Reason" options={[{ value: 'stock', label: 'Out of stock' }]} />
        </Modal>
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Your cart"
          footer={<Button fullWidth>Checkout</Button>}
        >
          <p className="p-4 text-sm">Bottom sheet on phones, side panel on larger screens.</p>
        </Drawer>
      </Section>
    </>
  );
}

export default function DevUiPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">KJT Foodie UI kit</h1>
        <Link to="/dev/tokens" className="text-sm text-primary-700 underline">
          Design tokens
        </Link>
      </header>
      <DevUiSections />
    </main>
  );
}
