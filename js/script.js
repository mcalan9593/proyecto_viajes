document.addEventListener('DOMContentLoaded', () => {
    // 1. Botón Volver Arriba
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '↑';
    backToTopButton.title = 'Volver arriba';
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // 2. Variables existentes
    const botones = document.querySelectorAll('.filtro-btn');
    const tarjetasContainer = document.getElementById('contenedor-cards');
    const temaSelector = document.getElementById('temaSelector');
    const exchangeRateDisplay = document.createElement('div');
    exchangeRateDisplay.id = 'exchange-rate-display';
    exchangeRateDisplay.style.textAlign = 'center';
    exchangeRateDisplay.style.margin = '10px 0';
    exchangeRateDisplay.style.fontSize = '0.9em';
    document.querySelector('header').appendChild(exchangeRateDisplay);
    
    const EXCHANGE_API = 'https://api.frankfurter.app/latest?from=EUR';

    // 3. Función para formatear fecha
    const formatDate = (date) => {
        if (!(date instanceof Date)) return "Fecha no disponible";
        
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('es-MX', options);
    };

    // 4. Función updateExchangeRates
    async function updateExchangeRates() {
        const today = new Date();
        const storedRates = localStorage.getItem('exchangeRates');

        try {
            let rates;
            if (storedRates) {
                const { date, rates: cachedRates } = JSON.parse(storedRates);
                if (date === today.toDateString()) {
                    rates = cachedRates;
                    rates.updated = new Date(rates.updated);
                    if(isNaN(rates.updated.getTime())) {
                        rates.updated = new Date();
                    }
                }
            }
            if (!rates) {
                const response = await fetch(EXCHANGE_API);
                const data = await response.json();
                rates = {
                    USD: data.rates.USD || 1.08,
                    MXN: data.rates.MXN || 20.50,
                    updated: new Date()
                };
                localStorage.setItem('exchangeRates', JSON.stringify({
                    date: today.toDateString(),
                    rates
                }));
            }

            exchangeRateDisplay.innerHTML = `
                <div class="exchange-info">
                    <div class="exchange-title">💵 Tipo de cambio</div>
                    <div class="exchange-rates">
                        1 EUR = ${rates.USD.toFixed(2)} USD | ${rates.MXN.toFixed(2)} MXN
                    </div>
                    <div class="exchange-time">
                        Actualizado: ${formatDate(rates.updated)}
                    </div>
                </div>
            `;

        } catch (error) {
            console.error("Error:", error);
            exchangeRateDisplay.innerHTML = `
                <div class="exchange-info error">
                    <div class="exchange-title">💵 Tipo de cambio (estimado)</div>
                    <div class="exchange-rates">
                        1 EUR ≈ 1.08 USD | 20.50 MXN
                    </div>
                    <div class="exchange-time">
                        Última conexión: ${formatDate(new Date())}
                    </div>
                </div>
            `;
        }
    }

    // 5. Función loadCSVData con acordeón corregido
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

                // Crear contenedores para cada país
                Object.keys(paises).forEach((pais, index) => {
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

                    // Crear ciudades para este país
                    Object.keys(paises[pais]).forEach(ciudad => {
                        const cityContainer = document.createElement('div');
                        cityContainer.classList.add('ciudad-container');
                        cityContainer.dataset.ciudad = ciudad.toLowerCase();

                        const cityTitle = document.createElement('h3');
                        cityTitle.textContent = ciudad;
                        cityContainer.appendChild(cityTitle);

                        // Sección Restaurantes
                        if (paises[pais][ciudad].Restaurantes.length > 0) {
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
                        }

                        // Sección Turismo
                        if (paises[pais][ciudad].Turismo.length > 0) {
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
                        }

                        countryContainer.appendChild(cityContainer);
                    });

                    // Evento corregido para el acordeón (símbolos +/-)
                    countryHeader.addEventListener('click', function() {
                        countryContainer.classList.toggle('expanded');
                        this.classList.toggle('expanded');
                        
                         if (countryContainer.classList.contains('expanded')) {
                            countryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    });

                    // Expandir el primer país por defecto
                    if (index === 0) {
                        countryContainer.classList.add('expanded');
                        countryHeader.classList.add('expanded');
                    }

                    tarjetasContainer.appendChild(countryContainer);
                });
            })
            .catch(error => console.error('Error loading CSV data:', error));
    }

    // 6. Funciones existentes
    function aplicarTema() {
        document.body.classList.toggle('dark-mode', temaSelector.checked);
    }

    function mostrarTarjetas(tipo) {
        const allCards = document.querySelectorAll('.card');
        const allRestaurantTitles = document.querySelectorAll('.restaurantes-title');
        const allTurismoTitles = document.querySelectorAll('.turismo-title');
        const allRestaurantWrappers = document.querySelectorAll('.restaurantes-wrapper');
        const allTurismoWrappers = document.querySelectorAll('.turismo-wrapper');

        if (tipo === 'todos') {
            allCards.forEach(card => card.style.display = 'block');
            allRestaurantTitles.forEach(title => title.style.display = 'block');
            allTurismoTitles.forEach(title => title.style.display = 'block');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
        } else {
            allCards.forEach(card => card.style.display = 'none');
            allRestaurantTitles.forEach(title => title.style.display = 'none');
            allTurismoTitles.forEach(title => title.style.display = 'none');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'none');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'none');

            const cardsToShow = document.querySelectorAll(`.card.${tipo}`);
            cardsToShow.forEach(card => card.style.display = 'block');

            if (tipo === 'Turismo') {
                allTurismoTitles.forEach(title => title.style.display = 'block');
                allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            } else {
                allRestaurantTitles.forEach(title => title.style.display = 'block');
                allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            }
        }
    }

    // 7. Event listeners
    temaSelector.addEventListener('change', aplicarTema);
    
    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const tipo = boton.getAttribute('data-tipo');
            botones.forEach(btn => btn.classList.remove('active'));
            boton.classList.add('active');
            mostrarTarjetas(tipo);
        });
    });

    // 8. Inicialización
    aplicarTema();
    updateExchangeRates();
    loadCSVData();
    mostrarTarjetas('todos');
});