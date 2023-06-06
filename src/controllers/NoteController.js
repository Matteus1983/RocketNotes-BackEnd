const knex = require("../database/knex")
// importando o knex para esse arquivo

class NotesController {
    async create(request,response){
        const { title, description, tags, links } = request.body; 
        const user_id = request.user.id;
        const [note_id] = await knex("notes").insert({
            title,
            description,
            user_id
        });

        const linksInsert = links.map(link => {
            return {
                note_id,
                url: link
            }
        });

        await knex('links').insert(linksInsert);

        const tagsInsert = tags.map(name => {
            return {
                note_id,
                name,
                user_id
            }
        });

        await knex('tags').insert(tagsInsert);

        return response.json();
    }

    async show(request,response){
        const { id } = request.params;

        const note = await knex("notes").where({id}).first();
        const tags = await knex("tags").where({ note_id: id}).orderBy('name');
        const links = await knex("links").where({ note_id: id}).orderBy('created_at');

        return response.json({
            ...note,
            tags,
            links
        })

    }

    async delete(request,response){
        const { id } = request.params;

        await knex('notes').where({ id }).delete();

        return response.json();
    }

    async index(request,response){
        const { title, tags } = request.query;
        const user_id = request.user.id;
        let notes;

        if (tags) {
            const filterTags = tags.split(',').map(tag => tag)
            
        notes = await knex('tags')
        .select([
            'notes.id',
            'notes.title',
            'notes.user_id'
        ])
        .where('notes.user_id', user_id)
        .whereLike('title', `%${title}%`)
        .whereIn('tags.name', filterTags)
        .innerJoin('notes', 'notes.id', 'tags.note_id')
        .groupBy('notes.id')
        .orderBy('notes.title')

        } else {
         notes = await knex('notes')
            .where({ user_id })
            .whereLike('title', `%${title}%`)
            .orderBy('title')
        }   

        const userTags = await knex('tags').where({ user_id });
// fazer um filtro em todas as tags, onde a tag seja igual o id do usuário "user_id"  
        const notesWithTags = notes.map(note => {
// agora vai passar as "notes" pela função "map", que vai separar cada uma e dar o nome de "note"
        const noteTags = userTags.filter(tag => tag.note_id === note.id)
// depois vai filtrar as tags parar saber quais tag que possuem o id identico ao id da nota.

            return {
                ...note,
                tags:noteTags
            }
// aqui vai pegar e retornar a nota e adicionar ('espalhar') as tags filtradas
        });

        return response.json(notesWithTags)
// e aqui vai retornar as notas com tags 
    }
}

module.exports = NotesController
// exportando a class para caso outro arquivo que precise utiliza-lo 