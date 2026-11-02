export const AppConstants = {
  // Valores de fábrica originales
  factoryMenuPrice: 6.95,
  factoryAcogidaPrice: 16.97,

  // Claves de almacenamiento local
  STORAGE_KEY_DEFAULT_MENU: 'user_default_menu_price',
  STORAGE_KEY_DEFAULT_ACOGIDA: 'user_default_acogida_price',
  STORAGE_KEY_CURRENT_MENU: 'menuPrice',
  STORAGE_KEY_CURRENT_ACOGIDA: 'acogidaPrice',

  /**
   * Obtiene el precio de menú por defecto (personalizado o de fábrica)
   */
  getDefaultMenuPrice(): number {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_DEFAULT_MENU);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // fallback
    }
    return this.factoryMenuPrice;
  },

  /**
   * Obtiene el precio de acogida por defecto (personalizado o de fábrica)
   */
  getDefaultAcogidaPrice(): number {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_DEFAULT_ACOGIDA);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch {
      // fallback
    }
    return this.factoryAcogidaPrice;
  },

  /**
   * Guarda nuevos valores por defecto personalizados
   */
  saveDefaultPrices(menuPrice: number, acogidaPrice: number): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_DEFAULT_MENU, menuPrice.toString());
      localStorage.setItem(this.STORAGE_KEY_DEFAULT_ACOGIDA, acogidaPrice.toString());
    } catch {
      // fallback
    }
  },

  /**
   * Restablece los valores por defecto a los de fábrica
   */
  resetToFactoryDefaults(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY_DEFAULT_MENU);
      localStorage.removeItem(this.STORAGE_KEY_DEFAULT_ACOGIDA);
    } catch {
      // fallback
    }
  }
} as const;
