const response = ({
    payload = null,
    message = null,
    success = true,
    error = null
  }) => {
    return { payload, message, success, error };
  };

  module.exports=response