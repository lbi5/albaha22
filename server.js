// قائمة المسؤولين
const admins = [
  {
    email: "bn.rr332299@gmail.com",
    password: "1234", // لاحقاً يمكن تشفيرها
    role: "admin"
  },
  {
    email: "ahmed@example.com",
    password: "abcd",
    role: "admin"
  }
];

app.post('/api/admin-login', (req, res) => {
  const { email, password } = req.body;
  const admin = admins.find(u => u.email === email && u.password === password);

  if(admin){
    res.json({ success: true, message: "تم تسجيل الدخول بنجاح!", role: admin.role });
  } else {
    res.json({ success: false, message: "البريد أو كلمة المرور خاطئة!" });
  }
});
// حذف سيارة
app.delete('/api/delete-car/:index', (req,res)=>{
  const idx = parseInt(req.params.index);
  if(idx >=0 && idx < cars.length){
    cars.splice(idx,1);
    res.json({message:"تم حذف السيارة!"});
  } else {
    res.json({message:"خطأ: السيارة غير موجودة!"});
  }
});