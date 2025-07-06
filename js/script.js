document.addEventListener('DOMContentLoaded', () => {
    const botones = document.querySelectorAll('.filtro-btn');
    const tarjetasContainer = document.getElementById('contenedor-cards');
    const temaSelector = document.getElementById('temaSelector');

    function loadCSVData() {
        fetch('recomendaciones_completas.csv')
            .then(response => response.text())
            .then(data => {
                const rows = data.split('\n').slice(1);
                const paises = {}; 

                rows.forEach(row => {
                    const columns = row.split(',');
                    const nombre = columns[0];
                    let tipo = columns[1];
                    const recomendacion = columns[2];
                    const precio = columns[3];
                    const enlace = columns[4];
                    const pais = columns[5];
                    const ciudad = columns[6];
                    

                    tipo = tipo.replace(/\s+/g, '_');

                    if (!paises[pais]) {
                        paises[pais] = {};
                    }
                    
                    if (!paises[pais][ciudad]) {
                        paises[pais][ciudad] = { Restaurantes: [], Turismo: [] };
                    }

                    const recommendation = {
                        nombre,
                        tipo,
                        recomendacion,
                        precio,
                        enlace
                    };

                    if (tipo !== 'Turismo') {
                        paises[pais][ciudad].Restaurantes.push(recommendation);
                    } else {
                        paises[pais][ciudad].Turismo.push({
                            nombre,
                            tipo,
                            precio,
                            enlace
                        });
                    }
                });

                for (const pais in paises) {
                    const countryContainer = document.createElement('div');
                    countryContainer.classList.add('pais-container', pais.toLowerCase());

                    const countryHeader = document.createElement('div');
                    countryHeader.classList.add('pais-header');

                    const countryTitle = document.createElement('h2');
                    countryTitle.textContent = pais;
                    countryHeader.appendChild(countryTitle);

                    const flagImage = document.createElement('img');
                    flagImage.classList.add('flag');
                    if (pais === 'Bélgica') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Belgium.svg';
                    } else if (pais === 'Francia') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg';
                    } else if (pais === 'Italia') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/0/03/Flag_of_Italy.svg';
                    }
                    countryHeader.appendChild(flagImage);
                    countryContainer.appendChild(countryHeader);

                    for (const ciudad in paises[pais]) {
                        const cityContainer = document.createElement('div');
                        cityContainer.classList.add('ciudad-container');
                        cityContainer.dataset.ciudad = ciudad.toLowerCase();

                        const cityTitle = document.createElement('h3');
                        cityTitle.textContent = ciudad;
                        cityContainer.appendChild(cityTitle);

                        // Sección Restaurantes
                        const restaurantesTitle = document.createElement('h4');
                        restaurantesTitle.textContent = 'Restaurantes';
                        restaurantesTitle.classList.add('restaurantes-title');
                        cityContainer.appendChild(restaurantesTitle);

                        const restaurantsWrapper = document.createElement('div');
                        restaurantsWrapper.classList.add('cards-wrapper', 'restaurantes-wrapper');

                        paises[pais][ciudad].Restaurantes.forEach(item => {
                            const card = document.createElement('div');
                            card.classList.add('card', item.tipo);
                            card.innerHTML = `
                                <h4>${item.nombre}</h4>
                                <p><strong>Recomendación:</strong> ${item.recomendacion}</p>
                                <p><strong>Precio:</strong> ${item.precio}</p>
                                <a href="${item.enlace}" target="_blank">Ver en Google Maps</a>
                            `;
                            restaurantsWrapper.appendChild(card);
                        });

                        cityContainer.appendChild(restaurantsWrapper);

                        // Sección Turismo
                        const turismoTitle = document.createElement('h4');
                        turismoTitle.textContent = 'Lugares Turísticos';
                        turismoTitle.classList.add('turismo-title');
                        cityContainer.appendChild(turismoTitle);

                        const tourismWrapper = document.createElement('div');
                        tourismWrapper.classList.add('cards-wrapper', 'turismo-wrapper');

                        paises[pais][ciudad].Turismo.forEach(item => {
                            const card = document.createElement('div');
                            card.classList.add('card', item.tipo);
                            card.innerHTML = `
                                <h4>${item.nombre}</h4>
                                <p><strong>Precio:</strong> ${item.precio}</p>
                                <a href="${item.enlace}" target="_blank">Ver en Google Maps</a>
                            `;
                            tourismWrapper.appendChild(card);
                        });

                        cityContainer.appendChild(tourismWrapper);

                        countryContainer.appendChild(cityContainer);
                    }

                    tarjetasContainer.appendChild(countryContainer);
                }
            })
            .catch(error => console.error('Error loading CSV data:', error));
    }

    loadCSVData();

    function aplicarTema() {
        document.body.classList.toggle('dark-mode', temaSelector.checked);
    }

    temaSelector.addEventListener('change', aplicarTema);
    aplicarTema();

    function mostrarTarjetas(tipo) {
        const allCards = document.querySelectorAll('.card');
        const allRestaurantTitles = document.querySelectorAll('.restaurantes-title');
        const allTurismoTitles = document.querySelectorAll('.turismo-title');
        const allRestaurantWrappers = document.querySelectorAll('.restaurantes-wrapper');
        const allTurismoWrappers = document.querySelectorAll('.turismo-wrapper');

        if (tipo === 'todos') {
            // Mostrar todo
            allCards.forEach(card => card.style.display = 'block');
            allRestaurantTitles.forEach(title => title.style.display = 'block');
            allTurismoTitles.forEach(title => title.style.display = 'block');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
        } else {
            // Ocultar todo primero
            allCards.forEach(card => card.style.display = 'none');
            allRestaurantTitles.forEach(title => title.style.display = 'none');
            allTurismoTitles.forEach(title => title.style.display = 'none');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'none');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'none');

            // Mostrar solo lo correspondiente al filtro
            const cardsToShow = document.querySelectorAll(`.card.${tipo}`);
            cardsToShow.forEach(card => card.style.display = 'block');

            // Mostrar los títulos y wrappers correspondientes
            if (tipo === 'Turismo') {
                allTurismoTitles.forEach(title => title.style.display = 'block');
                allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            } else {
                allRestaurantTitles.forEach(title => title.style.display = 'block');
                allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            }
        }
    }

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const tipo = boton.getAttribute('data-tipo');
            botones.forEach(btn => btn.classList.remove('active'));
            boton.classList.add('active');
            mostrarTarjetas(tipo);
        });
    });
    mostrarTarjetas('todos');
});