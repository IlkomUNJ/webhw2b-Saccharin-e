# CozyLiving Image Assets

This folder contains all image assets for the CozyLiving website. Please add your images with the following names:

## Required Images

### 1. Hero Background Image
**Filename**: `hero-background.jpg` or `hero-background.png`
- **Location**: Homepage hero section
- **Resolution**: 1920x600px or higher
- **Format**: JPG, PNG, or WebP
- **Size**: Under 500KB for optimal loading
- **Subject**: Kitchen-related imagery (cooking, ingredients, kitchen tools)

### 2. About Page Story Image
**Filename**: `about-story.jpg` or `about-story.png`
- **Location**: About page "Our Story" section
- **Resolution**: 600x400px or higher
- **Format**: JPG, PNG, or WebP
- **Size**: Under 300KB
- **Subject**: Kitchen workspace, team photo, or cooking scene that represents your brand story

## Product Images

Product images are referenced in the markdown files located at:
`/resources/products/product-[1-10].md`

Each product file contains an `image` field in the frontmatter. You can update these paths to point to your actual product images.

**Example**:
```yaml
---
title: "Premium Chef's Knife"
image: "/images/products/chefs-knife.jpg"
---
```

## Fallback Behavior

If an image is not found, the site will:
1. For About page: Fall back to a kitchen-related image from Unsplash
2. For products: Show the current placeholder or default image

## Adding Images

1. Place your images in this `/public/images/` folder
2. Reference them in your code with `/images/filename.jpg`
3. For product images, create a subfolder: `/public/images/products/`

