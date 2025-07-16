import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const sampleMenuItems = [
  // Appetizers
  {
    name: 'Paneer Tikka',
    category: 'Appetizers',
    description: 'Marinated cottage cheese cubes grilled to perfection with bell peppers and onions',
    basePrice: 180,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 25,
    isAvailable: true,
  },
  {
    name: 'Chicken Seekh Kebab',
    category: 'Appetizers', 
    description: 'Spiced minced chicken formed into sausages and grilled on skewers',
    basePrice: 220,
    unit: 'per person',
    isVegetarian: false,
    isVegan: false,
    allergens: [],
    preparationTime: 30,
    isAvailable: true,
  },
  {
    name: 'Aloo Tikki Chaat',
    category: 'Appetizers',
    description: 'Crispy potato patties topped with yogurt, chutneys, and fresh ingredients',
    basePrice: 120,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 15,
    isAvailable: true,
  },

  // Main Course
  {
    name: 'Butter Chicken',
    category: 'Main Course',
    description: 'Tender chicken pieces in rich tomato-based creamy curry',
    basePrice: 280,
    unit: 'per person',
    isVegetarian: false,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 45,
    isAvailable: true,
  },
  {
    name: 'Dal Makhani',
    category: 'Main Course',
    description: 'Slow-cooked black lentils in rich creamy tomato gravy',
    basePrice: 160,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 60,
    isAvailable: true,
  },
  {
    name: 'Palak Paneer',
    category: 'Main Course',
    description: 'Fresh cottage cheese cubes in spiced spinach gravy',
    basePrice: 200,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 35,
    isAvailable: true,
  },
  {
    name: 'Chole Bhature',
    category: 'North Indian',
    description: 'Spicy chickpea curry served with fluffy fried bread',
    basePrice: 150,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Gluten'],
    preparationTime: 40,
    isAvailable: true,
  },

  // Desserts
  {
    name: 'Gulab Jamun',
    category: 'Desserts',
    description: 'Soft milk-solid dumplings soaked in rose-flavored sugar syrup',
    basePrice: 80,
    unit: 'per piece',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 30,
    isAvailable: true,
  },
  {
    name: 'Ras Malai',
    category: 'Desserts',
    description: 'Spongy cottage cheese dumplings in sweetened thickened milk',
    basePrice: 90,
    unit: 'per piece',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 45,
    isAvailable: true,
  },

  // Beverages
  {
    name: 'Masala Chai',
    category: 'Beverages',
    description: 'Traditional spiced tea with milk and aromatic herbs',
    basePrice: 25,
    unit: 'per person',
    isVegetarian: true,
    isVegan: false,
    allergens: ['Dairy'],
    preparationTime: 10,
    isAvailable: true,
  },
  {
    name: 'Fresh Lime Water',
    category: 'Beverages',
    description: 'Refreshing drink with fresh lime juice, mint, and salt/sugar',
    basePrice: 35,
    unit: 'per person',
    isVegetarian: true,
    isVegan: true,
    allergens: [],
    preparationTime: 5,
    isAvailable: true,
  },

  // Salads
  {
    name: 'Kachumber Salad',
    category: 'Salads',
    description: 'Fresh mixed vegetable salad with cucumber, tomato, onion, and lemon',
    basePrice: 60,
    unit: 'per person',
    isVegetarian: true,
    isVegan: true,
    allergens: [],
    preparationTime: 10,
    isAvailable: true,
  },

  // South Indian
  {
    name: 'Masala Dosa',
    category: 'South Indian',
    description: 'Crispy fermented crepe filled with spiced potato mixture',
    basePrice: 120,
    unit: 'per piece',
    isVegetarian: true,
    isVegan: true,
    allergens: [],
    preparationTime: 20,
    isAvailable: true,
  },
  {
    name: 'Idli Sambar',
    category: 'South Indian',
    description: 'Steamed rice cakes served with lentil soup and coconut chutney',
    basePrice: 80,
    unit: 'per person',
    isVegetarian: true,
    isVegan: true,
    allergens: [],
    preparationTime: 25,
    isAvailable: true,
  },
];

export const addSampleMenuItems = async () => {
  try {
    const promises = sampleMenuItems.map(item => 
      addDoc(collection(db, 'menuItems'), {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    
    await Promise.all(promises);
    console.log('Sample menu items added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample menu items:', error);
    return false;
  }
};

export default sampleMenuItems;
