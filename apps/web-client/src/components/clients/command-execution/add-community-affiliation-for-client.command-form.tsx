import { useState } from "react";
import { useExecuteClientCommandMutation } from "../store";
import { Loading } from "../../loading";
import { ApiResponseErrorInfo } from "../../error-handling";

interface AddCommunityAffiliationForClientCommandFormProps{
    context: {
        type: string;
        id: string;
    };
    onClose: () => void;
}

export const AddCommunityAffiliationForClientCommandForm = ({
    context,onClose
}: AddCommunityAffiliationForClientCommandFormProps) =>{
    const [communityId, setCommunityId] = useState<string|null>(null)

    const [executeCommand, {isLoading: isRequestInProgress, error}] = useExecuteClientCommandMutation();

    if(isRequestInProgress){
        return <Loading />
    }

    if(error){
        return <ApiResponseErrorInfo error={error}/>
    }

    const fsa = {
        type: "ADD_COMMUNITY_AFFILIATION_FOR_CLIENT",
        payload: {
            aggregateCompositeIdentifier: {
                type: context.type,
                id: context.id
            },
            communityId
        }
    }

    return <form
    onSubmit={() =>{
        executeCommand(fsa);

        onClose();
    }}
    >
        <label htmlFor="communityId-input">Add Community</label>
        <select value={communityId || ""} onChange={(e) =>{
            const value = e?.target?.value;

            console.log({
                newValueeeeeeeeeee: value
            })

            if(value){
                setCommunityId(value);
            }
        }}>
            <option value="7d11b1df-4d34-476f-9da7-fd77de375d35">Big River People</option>
            <option value="124">Some Other Community</option>
        </select>
        <button type="submit">Add Community</button>
    </form>
}