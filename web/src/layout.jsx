import { Outlet } from "react-router";
import { Avatar } from "./components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "./components/dropdown";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "./components/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "./components/sidebar";
import { SidebarLayout } from "./components/sidebar-layout";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import {
  Cog6ToothIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
  TicketIcon,
} from "@heroicons/react/20/solid";
import GitHub from "./icons/github";

function LayoutNavbar() {
  return (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href="/search" aria-label="Search">
          <MagnifyingGlassIcon />
        </NavbarItem>
        <NavbarItem href="/inbox" aria-label="Inbox">
          <InboxIcon />
        </NavbarItem>
        {/* <Dropdown>
        <DropdownButton as={NavbarItem}>
          <Avatar src="/profile-photo.jpg" square />
        </DropdownButton>
        <DropdownMenu className="min-w-64" anchor="bottom end">
          <DropdownItem href="/my-profile">
            <UserIcon />
            <DropdownLabel>My profile</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/settings">
            <Cog8ToothIcon />
            <DropdownLabel>Settings</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href="/privacy-policy">
            <ShieldCheckIcon />
            <DropdownLabel>Privacy policy</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/share-feedback">
            <LightBulbIcon />
            <DropdownLabel>Share feedback</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href="/logout">
            <ArrowRightStartOnRectangleIcon />
            <DropdownLabel>Sign out</DropdownLabel>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown> */}
      </NavbarSection>
    </Navbar>
  );
}

function LayoutSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        {/* <Dropdown>
          <DropdownButton as={SidebarItem} className="lg:mb-2.5">
            <Avatar src="/grasp-logo.svg" className="dark:hidden" />
            <img src="/grasp-logo-dark.svg" className="hidden dark:block h-5" />
            <SidebarLabel>Grasp</SidebarLabel>
          </DropdownButton>
          <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
            <DropdownItem href="/teams/1/settings">
              <Cog8ToothIcon />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/teams/1">
              <Avatar slot="icon" src="/grasp-logo.svg" />
              <DropdownLabel>Grasp</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/teams/2">
              <Avatar
                slot="icon"
                initials="WC"
                className="bg-purple-500 text-white"
              />
              <DropdownLabel>Workcation</DropdownLabel>
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem href="/teams/create">
              <PlusIcon />
              <DropdownLabel>New team&hellip;</DropdownLabel>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown> */}
        <div className="flex items-center gap-2 px-2 py-2.5">
          <Avatar src="/grasp-logo.svg" className="dark:hidden size-5" />
          <span className="text-sm/5">Grasp</span>
        </div>
        {/* <SidebarSection className="max-lg:hidden">
  <SidebarItem href="/search">
    <MagnifyingGlassIcon />
    <SidebarLabel>Search</SidebarLabel>
  </SidebarItem>
  <SidebarItem href="/inbox">
    <InboxIcon />
    <SidebarLabel>Inbox</SidebarLabel>
  </SidebarItem>
</SidebarSection> */}
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          <SidebarItem href="/">
            <HomeIcon />
            <SidebarLabel>Home</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/live">
            <Square2StackIcon />
            <SidebarLabel>Live Screen</SidebarLabel>
          </SidebarItem>
          {/* <SidebarItem href="/orders">
            <TicketIcon />
            <SidebarLabel>Records</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/settings">
            <Cog6ToothIcon />
            <SidebarLabel>Settings</SidebarLabel>
          </SidebarItem> */}
        </SidebarSection>
        {/* <SidebarSection className="max-lg:hidden">
          <SidebarHeading>Upcoming Events</SidebarHeading>
          <SidebarItem href="/events/1">Bear Hug: Live in Concert</SidebarItem>
          <SidebarItem href="/events/2">Viking People</SidebarItem>
          <SidebarItem href="/events/3">Six Fingers — DJ Set</SidebarItem>
          <SidebarItem href="/events/4">We All Look The Same</SidebarItem>
        </SidebarSection> */}
        <SidebarSpacer />
        <SidebarSection>
          <SidebarItem
            as="a"
            href="https://github.com/aircodelabs/grasp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHub className="size-5" />
            <SidebarLabel>View on GitHub</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            as="a"
            href="https://discord.gg/XFqCA9VqWe"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SparklesIcon />
            <SidebarLabel>Join Discord</SidebarLabel>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
      {/* <SidebarFooter className="max-lg:hidden">
<Dropdown>
  <DropdownButton as={SidebarItem}>
    <span className="flex min-w-0 items-center gap-3">
      <Avatar
        src="/profile-photo.jpg"
        className="size-10"
        square
        alt=""
      />
      <span className="min-w-0">
        <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
          Erica
        </span>
        <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
          erica@example.com
        </span>
      </span>
    </span>
    <ChevronUpIcon />
  </DropdownButton>
  <DropdownMenu className="min-w-64" anchor="top start">
    <DropdownItem href="/my-profile">
      <UserIcon />
      <DropdownLabel>My profile</DropdownLabel>
    </DropdownItem>
    <DropdownItem href="/settings">
      <Cog8ToothIcon />
      <DropdownLabel>Settings</DropdownLabel>
    </DropdownItem>
    <DropdownDivider />
    <DropdownItem href="/privacy-policy">
      <ShieldCheckIcon />
      <DropdownLabel>Privacy policy</DropdownLabel>
    </DropdownItem>
    <DropdownItem href="/share-feedback">
      <LightBulbIcon />
      <DropdownLabel>Share feedback</DropdownLabel>
    </DropdownItem>
    <DropdownDivider />
    <DropdownItem href="/logout">
      <ArrowRightStartOnRectangleIcon />
      <DropdownLabel>Sign out</DropdownLabel>
    </DropdownItem>
  </DropdownMenu>
</Dropdown>
</SidebarFooter> */}
    </Sidebar>
  );
}

export default function Layout() {
  return (
    <SidebarLayout navbar={<LayoutNavbar />} sidebar={<LayoutSidebar />}>
      <Outlet />
    </SidebarLayout>
  );
}
