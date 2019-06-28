const socket = io();

const $chatForm = document.querySelector('#message-form');
const $messageInput = $chatForm.querySelector('input');
const $messageFormButton = $chatForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $disconnectButton = document.querySelector('#disconnect');


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    const html = Mustache.render(messageTemplate,{
        username:message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
});

socket.on('locationMessage',(message)=>{
    const html = Mustache.render(locationTemplate,{
        username :message.username,
        url:message.url,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll()
});

socket.on('roomData',({room, users}) => {
   const html = Mustache.render(sidebarTemplate,{
       room,users
   })
   document.querySelector('#sidebar').innerHTML = html
})

$chatForm.addEventListener('submit',(e) =>{ 
    e.preventDefault();

    $messageFormButton.setAttribute('disabled','disabled')

    const msg = $messageInput.value;

    socket.emit('sendMessage',msg,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageInput.value = '';
        $messageInput.focus();

        if(error){
            return console.log(error);
        }
    });
});

$sendLocationButton.addEventListener('click', (e)=>{
    if(!navigator.geolocation){
        return alert('Geolocation isn"t supported by your browser');
    }
 
    $sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        socket.emit('sendLocation',{lat,lng},(error)=>{
            if(error){
                $sendLocationButton.removeAttribute('disabled');
            }
        });
    });
});

socket.emit('join', { username, room },(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})