import Link from "next/link";
import { Cart } from "./cart";
import styles from "./index.module.css";
import { Search } from "./search";

type Props = {
  name: string;
};

export function Header({ name }: Props) {
  return (
    <header className={styles.header}>
      <div>
        <Link href="/">
          <svg
            role="img"
            aria-label="Home"
            width={24}
            height={24}
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M12 2.68L22 20H2z"></path>
          </svg>
          <p>{name}</p>
        </Link>
        <div>
          <Search />
          <Cart />
        </div>
      </div>
    </header>
  );
}
