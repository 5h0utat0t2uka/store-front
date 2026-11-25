import Link from "next/link";
import { cx } from "@/utils/class";
import { Cart } from "./cart";
import { Search } from "./search";
import styles from "./index.module.css";

type Props = {
  name: string;
  className?: string;
};

export const Logo = ({ name, className }: Props) => {
  return (
    <Link href="/" className={cx(styles.logo, className)}>
      <svg role="img" aria-label="Home" width={24} height={24} viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m4-14h-1.35v4H16zM9.346 9.71l6.059 7.828l1.054-.809L9.683 8H8v7.997h1.346z"
        ></path>
      </svg>
      <p>{name}</p>
    </Link>
  );
};
export function Header({ name }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Logo name={name} />
        <div>
          <Search />
          <Cart />
        </div>
      </div>
    </header>
  );
}
