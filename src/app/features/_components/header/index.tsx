import Image from "next/image";
import { MAIN_WIDTH } from "@/styles/image-sizes";
import type { Feature } from "../../_data";
import styles from "./index.module.css";

type Props = {
  feature: Feature;
};

export default function Header({ feature }: Props) {
  return (
    <header className={styles.header}>
      <h1>{feature.title}</h1>
      <time dateTime={feature.date}>Published {feature.date}</time>
      <Image {...feature.image} alt="" sizes={MAIN_WIDTH} loading="eager" />
    </header>
  );
}
