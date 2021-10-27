const socket=io()

const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $LocationBtn=document.querySelector('#location-btn')
const $messages=document.querySelector('#messages')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sideBarTemplate=document.querySelector("#sidebar-template").innerHTML

//Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoScroll=()=> {
    $messages.scrollTop=$messages.scrollHeight
}

socket.on('message',(msg)=>{ 
 
    const html=Mustache.render(messageTemplate,{
        username:msg.username,
        message:msg.text,
        createdAt:moment(msg.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoScroll()

})
socket.on('locationMessage',(url)=>{
    const html=Mustache.render(locationTemplate,{
        username:url.username,
        url:url.url,
        createdAt:moment(url.createdAt).format('h mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    //console.log(url)
    autoScroll()
})

socket.on('roomData',({room,users})=>{
   const html=Mustache.render(sideBarTemplate,{
       room,
       users
   })
   document.querySelector('#sidebar').innerHTML=html
})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
//disable once submitted
    $messageFormButton.setAttribute('disabled','disabled')
    const msg=e.target.elements.message.value
    socket.emit('sendMessage',msg,(error)=>{
        //enable
        $messageFormInput.value=''
        $messageFormInput.focus()
        $messageFormButton.removeAttribute('disabled')
        if(error)
        {
            return console.log(error)
        }
        console.log('Message Delivered!')

    })

})

$LocationBtn.addEventListener('click',()=>{
    if(!navigator.geolocation)
    {
        return alert('Geolocation is not supported by browser')
    }
    $LocationBtn.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit('sendLocation',{
            lat:position.coords.latitude,
            long:position.coords.longitude
        },()=>{
            console.log('Location shared!')
            $LocationBtn.removeAttribute('disabled')
        })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error)
    {
        alert(error)
        location.href='/'
    }
})