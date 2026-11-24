import Image from "next/image";
import type { Feature } from "../../_data";
import styles from "./index.module.css";

type Props = {
  feature: Feature;
};

export default function Header({ feature }: Props) {
  return (
    <header className={styles.header}>
      <h1>{feature.title}</h1>
      <time dateTime={feature.date}>Published at {feature.date}</time>
      <Image src={feature.image.src} alt="" width={feature.image.width} height={feature.image.height} loading="eager" />
    </header>
  );
}
