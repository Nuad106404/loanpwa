// Fixed version of the saveFamilyContact function
const saveFamilyContact = async (req, res) => {
  try {
    
    // Get the family contact information from the request body
    const { familyName, familyPhone, relationship, familyAddress, phone, userId, nationalId } = req.body;
    
    // Find user by various identifiers
    let user = null;
    
    // Try to find by userId first
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch (e) {
      }
    }
    
    // If not found by userId, try by phone
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    // If still not found, try by nationalId
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with the provided information'
      });
    }
    
    
    // Update the user's family contact information directly
    user.familyContact = {
      familyName: familyName || '',
      familyPhone: familyPhone || '',
      relationship: relationship || '',
      address: {
        homeNumber: familyAddress?.homeNumber || '',
        subdistrict: familyAddress?.subdistrict || '',
        district: familyAddress?.district || '',
        province: familyAddress?.province || '',
        zipCode: familyAddress?.zipCode || ''
      }
    };
    
    
    // Save the updated user with validation disabled
    try {
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Error saving user with validation disabled:', saveError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save user: ' + saveError.message
      });
    }
    
    // Return the updated user information
    return res.status(200).json({
      status: 'success',
      message: 'Family contact information saved successfully',
      data: {
        user: {
          phone: user.phone
        },
        familyContact: user.familyContact
      }
    });
  } catch (error) {
    console.error('Error saving family contact information:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save family contact information: ' + error.message
    });
  }
};

module.exports = { saveFamilyContact };
