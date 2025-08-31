

export let profileData = {
    name: 'John Doe',
    email: user.email,
    phone: '+1 (555) 123-4567',
    job: 'Product Manager',
    department: 'Technology',
    location: 'New York, NY',
    bio: 'Passionate about technology and innovation. I enjoy creating solutions that make people\'s lives easier and more productive.',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    joined: 'January 15, 2024'
};

// Initialize profile and settings data on page load
export function initializeProfile() {
    document.getElementById('profile-name').textContent = profileData.name;
    document.getElementById('profile-email').textContent = profileData.email;
    document.getElementById('profile-phone').textContent = profileData.phone;
    document.getElementById('profile-job').textContent = profileData.job;
    document.getElementById('profile-department').textContent = profileData.department;
    document.getElementById('profile-location').textContent = profileData.location;
    document.getElementById('profile-bio').textContent = profileData.bio;
    document.getElementById('profile-joined').textContent = profileData.joined;
    document.getElementById('profile-avatar').src = profileData.avatar;
    
    // Update topbar avatar and name
    document.querySelector('.topbar .avatar').src = profileData.avatar;
    document.querySelector('.topbar .profile span:nth-of-type(1)').textContent = profileData.name;
    
    // Update statistics (placeholder values - you can connect these to actual data)
    updateProfileStats();
}

function updateProfileStats() {
    // These would typically be calculated from your actual data
    document.getElementById('total-expenses').textContent = '24';
    document.getElementById('total-projects').textContent = '8';
    document.getElementById('total-ideas').textContent = '15';
    document.getElementById('total-contacts').textContent = '42';
    document.getElementById('training-sessions').textContent = '18';
    document.getElementById('active-days').textContent = '127';
}
        