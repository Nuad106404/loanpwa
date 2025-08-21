// Fixed version of the saveAddressInfo function
const saveAddressInfo = async (req, res) => {
  try {
    
    // Extract address data and user identifiers from the request body
    const { address, userId, phone, nationalId } = req.body;
    
    // Validate that address data exists
    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address information is required'
      });
    }
    
    // Find the user by userId, phone, or nationalId
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch (e) {
      }
    }
    
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    
    // Update user's address information - ensure field names match the User model
    user.address = {
      homeNumber: address.homeNumber || '',
      subdistrict: address.subdistrict || '',
      district: address.district || '',
      province: address.province || '',
      zipCode: address.zipCode || ''
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
    
    return res.status(200).json({
      status: 'success',
      message: 'Address information saved successfully',
      data: {
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error in saveAddressInfo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save address information: ' + error.message
    });
  }
};

module.exports = { saveAddressInfo };
