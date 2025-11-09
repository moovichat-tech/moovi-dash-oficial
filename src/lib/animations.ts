import { Variants } from 'framer-motion';

/**
 * Variantes para containers (pais)
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Variantes para cards individuais
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

/**
 * Variantes para fade simples
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  },
};

/**
 * Variantes para slide da esquerda
 */
export const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12,
    }
  },
};

/**
 * Variantes para slide da direita
 */
export const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 12,
    }
  },
};

/**
 * Animação de hover para cards
 */
export const hoverScale = {
  scale: 1.02,
  transition: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 20,
  },
};

/**
 * Animação de tap para botões
 */
export const tapScale = {
  scale: 0.98,
};
