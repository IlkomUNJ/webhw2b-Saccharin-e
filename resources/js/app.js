import '../css/app.css'

// Helper function to update wishlist counter
function updateWishlistCounter(increment) {
  const counterElement = document.getElementById('wishlist-count');
  if (counterElement) {
    const currentCount = parseInt(counterElement.textContent) || 0;
    const newCount = Math.max(0, currentCount + increment);
    counterElement.textContent = newCount;
  }
}

// Wishlist functionality
window.toggleWishlist = async function(event, slug) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.currentTarget;
  const icon = button.querySelector('.wishlist-icon');
  
  try {
    // Check current state
    const checkResponse = await fetch(`/wishlist/check/${slug}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const checkData = await checkResponse.json();
    const isInWishlist = checkData.inWishlist;
    
    // Toggle wishlist
    if (isInWishlist) {
      // Remove from wishlist
      const response = await fetch(`/wishlist/${slug}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update UI to show not in wishlist
        icon.setAttribute('fill', 'none');
        icon.classList.remove('text-red-500');
        icon.classList.add('text-gray-400');
        button.title = 'Add to wishlist';
        
        // Update counter (decrement)
        updateWishlistCounter(-1);
      }
    } else {
      // Add to wishlist
      const response = await fetch('/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ product_slug: slug })
      });
      
      if (response.ok) {
        // Update UI to show in wishlist
        icon.setAttribute('fill', 'currentColor');
        icon.classList.remove('text-gray-400');
        icon.classList.add('text-red-500');
        button.title = 'Remove from wishlist';
        
        // Update counter (increment)
        updateWishlistCounter(1);
      }
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
  }
}

// Initialize wishlist states on page load
document.addEventListener('DOMContentLoaded', async function() {
  const wishlistButtons = document.querySelectorAll('.wishlist-btn');
  
  for (const button of wishlistButtons) {
    const slug = button.dataset.slug;
    const icon = button.querySelector('.wishlist-icon');
    
    try {
      const response = await fetch(`/wishlist/check/${slug}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.inWishlist) {
        icon.setAttribute('fill', 'currentColor');
        icon.classList.remove('text-gray-400');
        icon.classList.add('text-red-500');
        button.title = 'Remove from wishlist';
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  }
});