import styles from "./index.module.css";

type Props = {
  name: string;
};

export function Header({ name }: Props) {
  return (
    <header className={styles.header}>
      <div>
        <p>{name}</p>
      </div>
    </header>
  );
}
