var previousTab = 'home-page';

let slideIndex = 1;
showSlides(slideIndex);

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

// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
} 