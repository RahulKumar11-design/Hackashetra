// middleware/auth.js
module.exports.isAuthenticated = (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.status(401).json({ message: 'Please log in to access this resource' });
    }
module.exports.check=(req,res,next)=>{
  console.log("hi");
  console.log(req.body);
  next();
}
module.exports.aftercheck=(req,res,next)=>{
  console.log("hello");
  console.log(req.body);
  next();
}