const Express=require('express')
const cors=require('cors')
const Mongoose=require('mongoose')
const jwt=require('jsonwebtoken')
const bodyParser=require('body-parser')
const bcrypt=require('bcryptjs')
require('dotenv').config()// processing the environment variables
const app=Express()
//initializing the cors
const PORT=process.env.Port
console.log(PORT)
app.use(cors())
app.use(bodyParser.json())

///listening to port

//connecting our database to mongodb using mongoose

Mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log('database successfully connected')
}).catch((error)=>{
    console.log(error)
})

///creating schema for admin users

const AuthSchema=Mongoose.Schema({
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true}
})


//creating a model for admin
const Auth=Mongoose.model("admin",AuthSchema)



///creating a admin user api

app.post('/admin',async function(req,res){
    const {adminEmail,adminPassword}=req.body
     const existingUser=  await Auth.findOne({email:adminEmail})
     if(existingUser){
        console.log('user already exists')
        res.status(409).json({error:'account already exists'})
     }
     try{
        const hashingPassword= await bcrypt.hash(adminPassword,10)

        const auth= new Auth({
            email:adminEmail,
            password:hashingPassword,
        })
        await auth.save()

       return res.status(200).json({message:'Admin account created successfully'})
     }
     catch{
        res.status(400).json({error:'account not created successfuly'})
     }
    
})


app.post('/login',async function(req,res){
    const{email,password}=req.body

    const existinguser= await Auth.findOne({email:email})
    if(!existinguser){
       return res.status(400).json({error:'access denied'})
    }

    const checkingPassword= await bcrypt.compare(password,existinguser.password)
    if(!checkingPassword){
       return res.status(400).json({error:'invalid password'})
    }

    try{
        const token= jwt.sign({id:existinguser._id,email:existinguser.email},process.env.SECRET_KEY,{expiresIn:'1h'})
        return res.status(200).json({token})
    }catch{
        return res.status(500).json({error:'Network error'})
    }
})

const verifyJWTtoken=(req,res,next)=>{
    const authHeader = req.header('Authorization');

    if(!authHeader){
        return res.status(401).json({ error: 'Access denied, token missing!' });
    }
    
          const token = authHeader.replace('Bearer ', '');

    try{
        const verifying= jwt.verify(token,process.env.SECRET_KEY)

        req.user=verifying;
        next();
    }catch(error){
        res.status(400).json({error:'invalid token'})
    }

}


///songs creation section

const SongSchema=Mongoose.Schema({
title:{type:String,required:true},
movie:{type:String,required:true},
artist:{type:String,required:true},
genre:{type:String,required:true},
image:{type:String,required:true},
audio:{type:String,required:true}
})

///creating a model 
const Song=Mongoose.model('songs',SongSchema)

//create songs

app.post('/songs', async function(req,res){
    const {songTitle,movieName,artist,genre,imgUrl,audioUrl}=req.body
    const existingSong= await Song.findOne({title:songTitle})
    if(existingSong){
        res.status(409).json({error:'already this song in our database'})
    }
    try{
        const song= new Song({
            title:songTitle,
            movie:movieName,
            artist:artist,
            genre:genre,
            image:imgUrl,
            audio:audioUrl
        })

        await song.save()
        res.status(200).json({message:'A new song successfully added ✔️'})
    }
    catch(error){
        res.status(500).json({error:'server error'})
    }
})

///get songs 

app.get('/songs',async function(req,res){
    try{
        const Songs= await Song.find()
        return res.status(200).json({Songs})
    }
    catch(error){
        return res.status(400).json({error:'access denied'})
    }
     
})

//deleting song

app.delete('/songs/:id',async function(req,res){
  const songID=req.params.id
  const deleteSong= await Song.findByIdAndDelete(songID)
  return res.status(200).json({message:'successfully deleted'})
  console.log(songID)
})
app.listen(PORT,()=>{
    console.log('server connected')
})