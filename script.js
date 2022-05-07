var previousTab = 'home-page';
document.addEventListener("click", deleteLogo);

function swapMiddle(p,n){
    document.getElementById(p).style.display='none';
    document.getElementById(n).style.display='initial';
    previousTab = n;
}

function showSideBar(){
    document.getElementById('side-nav-bar').style.display='flex';
    document.getElementById('filter').style.display='block';
}

function hideSideBar(){
    document.getElementById('side-nav-bar').style.display='none';
    document.getElementById('filter').style.display='none';
}