async function load() {
  
  await addcomp('navbar-placeholder', './comps/nav.html');
  await addcomp('searchbar-placeholder', './comps/searchbar.html');
  await searchjsfunc();
  await addcomp('header-placeholder', './comps/header.html');
  await addcomp('catagory-placeholder', './comps/catagory.html');

}



load()