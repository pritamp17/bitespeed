exports.validateEmailAndPhoneNumber = (email, phoneNumber) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;
  
    if (email != null && !emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  
    if (phoneNumber != null && !phoneRegex.test(phoneNumber)) {
      throw new Error('Invalid phone number format. It should be 10 digits');
    }
  };

