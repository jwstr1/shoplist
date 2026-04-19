/**
 * Category mapping — converts item names to aisle categories.
 * Also provides sort order for aisle navigation.
 */

export const CATEGORIES = [
  'Produce',
  'Bakery',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Deli',
  'Frozen',
  'Pantry',
  'Snacks & Confectionery',
  'Beverages',
  'Cleaning & Household',
  'Personal Care',
  'Baby',
  'Pet',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_ORDER: Record<Category, number> = {
  Produce: 1,
  Bakery: 2,
  'Dairy & Eggs': 3,
  'Meat & Seafood': 4,
  Deli: 5,
  Frozen: 6,
  Pantry: 7,
  'Snacks & Confectionery': 8,
  Beverages: 9,
  'Cleaning & Household': 10,
  'Personal Care': 11,
  Baby: 12,
  Pet: 13,
  Other: 14,
}

export const CATEGORY_ICONS: Record<Category, string> = {
  Produce: '🥦',
  Bakery: '🍞',
  'Dairy & Eggs': '🥛',
  'Meat & Seafood': '🥩',
  Deli: '🧀',
  Frozen: '🧊',
  Pantry: '🥫',
  'Snacks & Confectionery': '🍫',
  Beverages: '☕',
  'Cleaning & Household': '🧹',
  'Personal Care': '🧴',
  Baby: '🍼',
  Pet: '🐾',
  Other: '📦',
}

// Keyword-to-category mapping for automatic categorisation
const KEYWORD_MAP: Array<{ keywords: string[]; category: Category }> = [
  {
    keywords: [
      'apple', 'banana', 'orange', 'lemon', 'lime', 'mango', 'pineapple',
      'strawberry', 'blueberry', 'raspberry', 'grape', 'watermelon', 'rockmelon',
      'avocado', 'tomato', 'cucumber', 'lettuce', 'spinach', 'kale', 'broccoli',
      'cauliflower', 'carrot', 'potato', 'sweet potato', 'onion', 'garlic',
      'capsicum', 'zucchini', 'eggplant', 'mushroom', 'corn', 'peas', 'beans',
      'celery', 'cabbage', 'pumpkin', 'salad', 'herb', 'coriander', 'parsley',
      'basil', 'mint', 'ginger', 'chilli', 'radish', 'beetroot', 'asparagus',
      'leek', 'spring onion', 'shallot', 'fresh', 'fruit', 'vegetable', 'veg',
    ],
    category: 'Produce',
  },
  {
    keywords: [
      'bread', 'sourdough', 'bagel', 'roll', 'bun', 'croissant', 'muffin',
      'crumpet', 'toast', 'loaf', 'pita', 'wrap', 'tortilla', 'flatbread',
      'cake', 'pastry', 'donut', 'danish', 'scroll', 'hot cross bun',
    ],
    category: 'Bakery',
  },
  {
    keywords: [
      'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt', 'egg', 'eggs',
      'sour cream', 'creme fraiche', 'cottage cheese', 'ricotta', 'brie',
      'camembert', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'haloumi',
      'kefir', 'custard', 'dairy', 'lactose', 'oat milk', 'almond milk',
      'soy milk', 'coconut milk', 'plant milk',
    ],
    category: 'Dairy & Eggs',
  },
  {
    keywords: [
      'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'salmon', 'tuna',
      'fish', 'prawn', 'shrimp', 'crab', 'lobster', 'oyster', 'mussel',
      'squid', 'calamari', 'mince', 'steak', 'chop', 'fillet', 'breast',
      'thigh', 'drumstick', 'wing', 'sausage', 'bacon', 'ham', 'meatball',
      'schnitzel', 'roast', 'brisket', 'rib', 'seafood', 'meat',
    ],
    category: 'Meat & Seafood',
  },
  {
    keywords: [
      'salami', 'prosciutto', 'mortadella', 'pepperoni', 'pastrami',
      'smoked salmon', 'dip', 'hummus', 'tzatziki', 'tabouli', 'olives',
      'antipasto', 'cold cut', 'deli', 'cooked chicken', 'rotisserie',
    ],
    category: 'Deli',
  },
  {
    keywords: [
      'frozen', 'ice cream', 'gelato', 'sorbet', 'frozen meal', 'frozen pizza',
      'frozen peas', 'frozen corn', 'frozen chips', 'chips', 'potato wedges',
      'frozen fish', 'frozen chicken', 'frozen vegetables', 'edamame',
      'ice', 'ice block', 'paddle pop', 'magnum', 'streets',
    ],
    category: 'Frozen',
  },
  {
    keywords: [
      'pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar',
      'sauce', 'ketchup', 'tomato sauce', 'bbq sauce', 'soy sauce', 'fish sauce',
      'oyster sauce', 'mayonnaise', 'mustard', 'relish', 'chutney', 'jam',
      'honey', 'vegemite', 'peanut butter', 'nutella', 'spread', 'canned',
      'tin', 'tuna can', 'soup', 'stock', 'broth', 'beans can', 'chickpeas',
      'lentils', 'coconut', 'curry paste', 'spice', 'herb dried', 'baking',
      'yeast', 'baking powder', 'bicarb', 'cornflour', 'breadcrumbs', 'panko',
      'cereal', 'oats', 'muesli', 'porridge', 'granola', 'noodle', 'spaghetti',
      'penne', 'fusilli', 'couscous', 'quinoa', 'lentil', 'nut', 'seeds',
    ],
    category: 'Pantry',
  },
  {
    keywords: [
      'chip', 'cracker', 'biscuit', 'cookie', 'chocolate', 'lolly', 'candy',
      'lollipop', 'popcorn', 'pretzel', 'rice cake', 'muesli bar', 'protein bar',
      'snack', 'tim tam', 'oreo', 'freddo', 'milkybar', 'twix', 'snickers',
      'mars bar', 'caramel', 'gummy', 'jelly',
    ],
    category: 'Snacks & Confectionery',
  },
  {
    keywords: [
      'water', 'sparkling water', 'juice', 'soft drink', 'cola', 'pepsi',
      'lemonade', 'beer', 'wine', 'spirits', 'cider', 'kombucha', 'soda',
      'energy drink', 'sports drink', 'coffee', 'tea', 'hot chocolate',
      'milo', 'ovaltine', 'cordial', 'smoothie', 'drink', 'beverage',
    ],
    category: 'Beverages',
  },
  {
    keywords: [
      'detergent', 'dishwashing', 'dishwasher', 'laundry', 'washing powder',
      'fabric softener', 'bleach', 'disinfectant', 'spray cleaner', 'wipe',
      'mop', 'sponge', 'scrubber', 'toilet paper', 'paper towel', 'tissue',
      'glad wrap', 'foil', 'zip lock', 'garbage bag', 'bin liner', 'cleaning',
      'pine o clean', 'ajax', 'dettol', 'mortein', 'baygon', 'sunlight',
    ],
    category: 'Cleaning & Household',
  },
  {
    keywords: [
      'shampoo', 'conditioner', 'soap', 'body wash', 'moisturiser', 'sunscreen',
      'deodorant', 'toothbrush', 'toothpaste', 'mouthwash', 'floss', 'razor',
      'shaving', 'makeup', 'mascara', 'lipstick', 'foundation', 'perfume',
      'cologne', 'hair', 'skincare', 'bandaid', 'panadol', 'nurofen',
      'vitamins', 'supplement', 'medicine', 'medication', 'tampons', 'pads',
      'sanitary', 'contraceptive', 'condom', 'cotton ball', 'cotton pad',
    ],
    category: 'Personal Care',
  },
  {
    keywords: [
      'nappy', 'diaper', 'wipes baby', 'formula', 'baby food', 'puree',
      'baby cereal', 'baby bottle', 'dummy', 'pacifier', 'sippy cup',
      'baby wash', 'nappy cream', 'sudocrem', 'baby powder',
    ],
    category: 'Baby',
  },
  {
    keywords: [
      'dog food', 'cat food', 'pet food', 'bird seed', 'fish food', 'cat litter',
      'dog treat', 'cat treat', 'flea', 'tick', 'worming', 'paws', 'leash',
      'collar', 'pet', 'aquarium',
    ],
    category: 'Pet',
  },
]

/**
 * Classify an item name into a shopping category.
 * Uses keyword matching; returns 'Pantry' as default.
 */
export function categoriseItem(itemName: string): Category {
  const lower = itemName.toLowerCase().trim()

  for (const { keywords, category } of KEYWORD_MAP) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category
      }
    }
  }

  return 'Pantry'
}

/**
 * Sort list items by category aisle order, then by name within category.
 */
export function sortByAisle<T extends { category: string; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category as Category] ?? 99
    const orderB = CATEGORY_ORDER[b.category as Category] ?? 99
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
}

/**
 * Group items by category, sorted by aisle order.
 */
export function groupByCategory<T extends { category: string }>(
  items: T[]
): Map<string, T[]> {
  const sorted = [...items].sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category as Category] ?? 99
    const orderB = CATEGORY_ORDER[b.category as Category] ?? 99
    return orderA - orderB
  })

  const map = new Map<string, T[]>()
  for (const item of sorted) {
    const existing = map.get(item.category) ?? []
    existing.push(item)
    map.set(item.category, existing)
  }
  return map
}
