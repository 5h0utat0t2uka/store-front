import styles from "./index.module.css";

type Props = {
  name: string;
};

export function Footer({ name }: Props) {
  return (
    <footer className={styles.footer}>
      <div>
        <p>© 2016 {name}</p>
      </div>
    </footer>
  );
}
