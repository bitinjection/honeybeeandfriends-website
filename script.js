const nav = Nav();
const slideShow = SlideShow();
slideShow.currentSlide(1);

// const calendarDiv = document.getElementsByClassName("calendar")[0];

// const foodMenu = FoodMenu(2, 30, []);
// const calendarTable = foodMenu.createCalendarDomElement();

calendarDiv.appendChild(calendarTable);

function Nav() {
  let previousTab = 'home-page';

  const swapMiddle = (n) => {
    document.getElementById(previousTab).style.display = 'none';
    document.getElementById(n).style.display = 'initial';
    previousTab = n;
  }

  const showSideBar = () => {
    document.getElementById('side-nav-bar').style.display = 'flex';
    document.getElementById('filter').style.display = 'block';
  }

  const hideSideBar = () => {
    document.getElementById('side-nav-bar').style.display = 'none';
    document.getElementById('filter').style.display = 'none';
  }

  return {
    swapMiddle,
    showSideBar,
    hideSideBar
  }
}

function SlideShow() {

  let slideIndex = 1;

  // Next/previous controls
  const plusSlides = (n) => {
    showSlides(slideIndex += n);
  }

  // Thumbnail image controls
  const currentSlide = (n) => {
    showSlides(slideIndex = n);
  }

  const showSlides = (n) => {
    let i;
    let slides = document.getElementsByClassName("my-slides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) {
      slideIndex = 1;
    }
    if (n < 1) {
      slideIndex = slides.length;
    }
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
  }

  return {
    plusSlides,
    currentSlide
  }
}

function FoodMenu(startDay, totalDays, holdayDates) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const createCalendarDomElement = () => {
    const table = document.createElement('table');
    const weeks = totalDays / 5;

    const createHeader = () => {
      const headerRow = table.insertRow();

      for(let i=0; i < days.length; ++i) {
        const cell = headerRow.insertCell();
        cell.appendChild(document.createTextNode(days[i]))
        cell.style.border = '1px solid black';
        cell.style.borderSpacing = '0px';
      }

    };

    const populateDays = () => {
      const createWeekRow = (table) => table.insertRow();
      const createDayCell = (weekRow) => row.insertCell();

      const skipDays = (weekRow, daysToSkip) => {
        const adjustedDaysToSkip = startDay % days.length;
        for(let i=0; i < adjustedDaysToSkip; ++i) {
          weekRow.insertCell();
        }
      };

      const addMeals = () => {
        const totalWeeks = totalDays / 7;
        for (let row = 0; row < totalWeeks; ++row) {
          let column = (row === 0) ? startDay : 0;
          const weekRow = table.insertRow();

          if (column != 0) skipDays(weekRow, startDay);

          while (column < days.length) {
            var cell = weekRow.insertCell();
            cell.appendChild(document.createTextNode(days[column] + `${row}, ${column}`));
            cell.style.border = '1px solid black';
            cell.style.borderSpacing = '0px';
            column++;
          }
        }
      }

      addMeals();
    };


    createHeader();
    populateDays();

    return table;
  };

  return {
    createCalendarDomElement
  };
}