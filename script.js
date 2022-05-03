var previousTab = 'home-page';

function swapMiddle(p,n){
    document.getElementById(p).style.display='none';
    document.getElementById(n).style.display='initial';
    previousTab = n;
}