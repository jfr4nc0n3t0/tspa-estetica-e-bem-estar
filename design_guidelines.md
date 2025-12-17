# Design Guidelines: SPA de Fisioterapia - Landing Page

## Design Approach

**Reference-Based Approach**: Drawing inspiration from premium wellness and hospitality brands (Airbnb, luxury spa websites, boutique health centers). The design emphasizes trust, professionalism, and tranquility through clean layouts and generous whitespace.

**Design Principles**:
- Calming sophistication with professional credibility
- Visual storytelling through high-quality imagery
- Accessibility and ease of contact (WhatsApp integration crucial for Brazilian market)
- Clear service differentiation and information hierarchy

## Typography

**Font Families** (via Google Fonts):
- Headings: 'Playfair Display' (serif) - elegant, professional
- Body: 'Inter' (sans-serif) - clean, highly readable

**Hierarchy**:
- Hero Headline: text-5xl md:text-6xl lg:text-7xl, font-bold
- Section Titles: text-3xl md:text-4xl lg:text-5xl, font-bold
- Subsection Headers: text-2xl md:text-3xl, font-semibold
- Service Titles: text-xl md:text-2xl, font-semibold
- Body Text: text-base md:text-lg, font-normal
- Small Text/Labels: text-sm, font-medium

## Layout System

**Spacing Primitives**: Consistently use Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24, 32**
- Micro spacing: p-2, gap-4
- Component padding: p-6, p-8
- Section spacing: py-16 md:py-24 lg:py-32
- Container gaps: gap-8, gap-12

**Container Structure**:
- Max width: max-w-7xl mx-auto
- Content sections: px-4 md:px-6 lg:px-8
- Text-heavy areas: max-w-4xl mx-auto

## Page Structure & Sections

### 1. Hero Section
- Full viewport height (min-h-screen) with large background image of spa environment
- Centered content with gradient overlay for text readability
- Headline + subtitle + dual CTA buttons (WhatsApp principal, "Conheça Nossos Serviços" secundário)
- Buttons with backdrop-blur-md bg-white/20 for glass effect over image
- Scroll indicator at bottom

### 2. Sobre (About) Section
- Two-column layout (lg:grid-cols-2)
- Left: Professional portrait image of physiotherapist (rounded-2xl with shadow)
- Right: Biography, credentials, philosophy text
- py-20 md:py-32 section padding
- Background: subtle texture or solid

### 3. Experiências (Services) Section
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Service cards with:
  - Top: Service image (aspect-video, rounded-t-xl)
  - Title (text-xl font-semibold)
  - Detailed description (3-4 lines minimum)
  - Duration and benefits list
  - "Saiba Mais" link
- Cards: shadow-lg hover:shadow-xl transition, rounded-xl, overflow-hidden
- Minimum 6 service offerings displayed

### 4. Localização (Location) Section
- Two-column split (lg:grid-cols-2)
- Left: Embedded Google Maps iframe (aspect-square md:aspect-video)
- Right: 
  - Complete address with icon
  - Business hours
  - Phone number
  - Parking/accessibility info
- Icons from Heroicons

### 5. Contato (Contact) Section
- Centered layout max-w-2xl
- Contact form with fields:
  - Nome (full width)
  - Email (half width)
  - Telefone (half width)
  - Mensagem (textarea, full width)
- Primary CTA: "Enviar Mensagem"
- Below form: WhatsApp floating button component (fixed bottom-6 right-6, z-50)
- Social proof element: "Respondemos em até 2 horas"

### 6. Footer
- Three-column grid (md:grid-cols-3)
- Column 1: Logo + brief tagline
- Column 2: Quick links (Sobre, Serviços, Contato)
- Column 3: Social media icons (Instagram, Facebook, WhatsApp) with links
- Bottom bar: Copyright, privacy policy link
- Background slightly different from body

## Component Library

**Navigation**:
- Fixed header: backdrop-blur-lg bg-white/80, shadow-sm
- Logo left, menu items center-right
- Mobile: Hamburger menu
- Smooth scroll to sections

**Buttons**:
- Primary: rounded-full px-8 py-4 text-lg font-semibold
- Secondary: rounded-full px-8 py-4 text-lg font-semibold border-2
- Icon buttons: rounded-full p-3 (social icons)

**Cards (Service)**:
- Border: border border-gray-200 or shadow-based
- Padding: p-6
- Image container: aspect-video with object-cover
- Hover: transform scale-105 transition

**Form Inputs**:
- Rounded: rounded-lg
- Padding: px-4 py-3
- Border: border-2 focus:border-accent
- Labels: text-sm font-medium mb-2

**Icons**: Heroicons via CDN
- Navigation: menu, close
- Contact: phone, envelope, map-pin
- Social: Custom social brand icons
- Features: check-circle, sparkles

## Images

**Required Images**:
1. **Hero**: Large, professional spa interior or treatment room (calming, high-quality)
2. **About**: Professional headshot of physiotherapist
3. **Services** (6 images): Each service with representative treatment photo
4. **Ambient**: Subtle background textures for sections

**Image Treatment**:
- All images: rounded corners (rounded-xl or rounded-2xl)
- Hero: Full background with gradient overlay
- Cards: aspect-ratio maintained, object-cover
- Optimize for web performance

## Accessibility

- All form inputs with proper labels and aria-labels
- Focus states clearly visible (ring-2 ring-offset-2)
- Sufficient contrast ratios throughout
- Alt text for all images in Portuguese
- Keyboard navigation support
- ARIA labels for icon-only buttons

## Multi-Column Strategy

- **Desktop (lg:)**: 3 columns for services, 2 for about/location
- **Tablet (md:)**: 2 columns for services, stacked for about/location  
- **Mobile**: Single column throughout

## WhatsApp Integration
- Floating action button (fixed positioning)
- Click-to-chat with pre-filled message
- Prominent placement in hero and contact section
- Icon from Heroicons or Font Awesome

This design creates a sophisticated, trust-building experience that showcases professionalism while maintaining warmth and accessibility essential for wellness services.