# features
- [] add a button in the middle of sliders to collapse and replace with small button on side to open again
- [] since we never paint on background, create an input color to change background color
- [x] when adding new layer, switch to current layer to that layer?
- [x] keyboard shortcuts for tool
- [] reorder layers
- [] renaming layers
- [] move layers up and down with buttons
- [] clear layer

- [] compress addLayer and addLayerWithoutMessage
- [] compress deleteLayer and deleteLayerWithoutMessage

# bugs
- [x] color selector does not work on firefox
    - update: input color window shows up in a different window and i just 
    didn't see it
- [] change size on canvas on window resize?
- [] get started button on landing page can be clicked multiple times and mess up the page
    - remove the listener once it is clicked
- [x] if both players are in room when first player leaves and rejoins they don't 
know of the other player
- [x] mobile players have problems with screen moving
- [x] sometimes clients do not receive socket number even though it was sent out. this causes all sorts of problems with uninitialized variables
    - solution is to have server continually send out socket number with set interval until the client responds that it has received their socket number
    - once the client has recieved their socket number, the ready button should go from visibility hidden to visibilty visible
- [] has not occurred yet, but if selecting a layer message gets lost then paint would look different to each player
- [] add automatic disconnect after certain amount of time if inactive

# socket.io post handshake
## current
- only leader sockets trigger the switch button
    - because we don't want the canvas being switch twice every time we click
## want
- both sockets to trigger the switch button handler
    - only leader sockets will swap the canvas
- each socket will manage their own layer window div
    - #layer-window for first canvas and #layer-window2 for second canvas
- each socket will only trigger buttons when their canvas is active
    - with exception being that both sockets will always trigger switch button
    handler


